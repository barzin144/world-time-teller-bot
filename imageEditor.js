import Jimp from "jimp";
import fs from "fs";

const setTextOnImage = async (image, imagePath, time) => {
  try {
    let imgURL = `./staticFiles/${image}`;
    let cityImage = await Jimp.read(imgURL).catch((error) =>
      console.log("error ", error)
    );
    let cityImageWidth = cityImage.bitmap.width;
    let cityImageHeight = cityImage.bitmap.height;
    let imgDarkener = new Jimp(cityImageWidth, cityImageHeight, "#000000");
    imgDarkener = imgDarkener.opacity(0.5);
    cityImage = cityImage.composite(imgDarkener, 0, 0);

    let posX = cityImageWidth / 15;
    let posY = cityImageHeight / 15;
    let maxWidth = cityImageWidth - posX * 2;
    let maxHeight = cityImageHeight - posY;

    let font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    await cityImage.print(
      font,
      posX,
      posY,
      {
        text: time,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      maxWidth,
      maxHeight
    );

    cityImage.writeAsync(imagePath);
    console.log("Image generated successfully");
  } catch (error) {
    console.log("error editing image", error);
  }
};

const deleteImage = (imagePath) => {
  fs.unlink(imagePath, (err) => {
    if (err) {
      return;
    }
    console.log("file deleted");
  });
};

export { setTextOnImage, deleteImage };
