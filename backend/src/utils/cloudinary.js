import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadBase64Image = async (base64) => {
  if (!base64) return null;
  const res = await cloudinary.uploader.upload(base64, {
    folder: 'skill-swap/profiles'
  });
  return res.secure_url;
};

export const uploadChatFile = async (base64) => {
  if (!base64) return null;
  const res = await cloudinary.uploader.upload(base64, {
    folder: 'skill-swap/chat'
  });
  return res.secure_url;
};

