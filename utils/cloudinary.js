const cloudinary = require("cloudinary").v2;

exports.uploadImage = async ({ file, folder = "club", name = "" }) => {
  try {
    if (!file) {
      return null;
    }

    const filePath = file.tempFilePath;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.log(error);
    return { error: error };
  }
};

exports.deleteImage = async (public_id) => {
  try {
    if (!public_id) {
      return null;
    }

    const result = await cloudinary.uploader.destroy(public_id);

    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
