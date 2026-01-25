const s3 = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

exports.uploadFile = async (file, folder = 'session-notes') => {
  try {
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    };
  } catch (error) {
    console.error('Erreur upload S3:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
};

exports.getSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: expiresIn,
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Erreur signed URL:', error);
    throw new Error('Erreur lors de la génération du lien');
  }
};

exports.deleteFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression S3:', error);
    throw new Error('Erreur lors de la suppression du fichier');
  }
};