import { 
  S3Client, 
  CreateBucketCommand, 
  PutBucketWebsiteCommand, 
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand, 
  PutObjectCommand 
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const region = 'us-east-1';
const bucketName = 'mayiliragu-admin-stage';

const s3Client = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

const mimeMap = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

async function getFiles(dir) {
  const subdirs = await fs.promises.readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await fs.promises.stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
}

async function run() {
  console.log(`Checking / Creating S3 Bucket: ${bucketName}...`);
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket ${bucketName} created successfully.`);
  } catch (err) {
    if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
      console.log(`Bucket ${bucketName} already exists.`);
    } else {
      console.log(`Bucket notice: ${err.message}`);
    }
  }

  // 1. Disable Block Public Access
  console.log('Unblocking public access for website hosting...');
  try {
    await s3Client.send(
      new PutPublicAccessBlockCommand({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false
        }
      })
    );
    console.log('Public access unblocked.');
  } catch (err) {
    console.warn('Notice on unblocking public access:', err.message);
  }

  // 2. Enable Static Website Hosting
  console.log('Configuring Static Website Hosting...');
  try {
    await s3Client.send(
      new PutBucketWebsiteCommand({
        Bucket: bucketName,
        WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html' },
          ErrorDocument: { Key: 'index.html' }
        }
      })
    );
    console.log('Static website hosting configured.');
  } catch (err) {
    console.error('Error configuring static website hosting:', err.message);
  }

  // 3. Set Bucket Policy for Public Read Access
  console.log('Setting Public Read Bucket Policy...');
  try {
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy)
      })
    );
    console.log('Public Read Policy applied successfully.');
  } catch (err) {
    console.error('Error setting bucket policy:', err.message);
  }

  // 4. Configure CORS
  console.log('Configuring Bucket CORS...');
  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: []
            }
          ]
        }
      })
    );
    console.log('Bucket CORS configured successfully.');
  } catch (err) {
    console.error('Error setting CORS:', err.message);
  }

  // 5. Upload dist files
  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.error(`Dist directory does not exist: ${distDir}`);
    process.exit(1);
  }

  const allFiles = await getFiles(distDir);
  console.log(`Uploading ${allFiles.length} files to S3 bucket ${bucketName}...`);

  for (const filePath of allFiles) {
    const relativePath = path.relative(distDir, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeMap[ext] || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: relativePath,
        Body: fileStream,
        ContentType: contentType
      })
    );
    console.log(`Uploaded: ${relativePath} (${contentType})`);
  }

  const s3WebsiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;
  console.log(`\n🎉 Admin Panel Staging Deployed Successfully to AWS S3!`);
  console.log(`S3 Web URL: ${s3WebsiteUrl}`);
}

run().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
