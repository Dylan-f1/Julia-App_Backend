const { S3Client } = require('@aws-sdk/client-s3');

let s3 = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log('AWS S3 configuré');
} else {
  console.log('⚠️ AWS S3 non configuré (clés manquantes)');
}

module.exports = s3;