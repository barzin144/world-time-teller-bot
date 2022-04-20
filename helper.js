const createInlineKeyboard = (
  list,
  callbackDataPrefix,
  eachRowCount,
  addBackButton = false,
  pagination = null
) => {
  const keyboard = [];
  let row = [];
  if (!!pagination) {
    const { pageSize, page } = pagination;
    list.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize).forEach((x) => {
      row.push({ text: x, callback_data: `${callbackDataPrefix}${x}` });
      if (row.length % eachRowCount === 0) {
        keyboard.push(row);
        row = [];
      }
    });
  } else {
    list.forEach((x) => {
      row.push({ text: x, callback_data: `${callbackDataPrefix}${x}` });
      if (row.length % eachRowCount === 0) {
        keyboard.push(row);
        row = [];
      }
    });
  }
  if (row.length !== 0) {
    keyboard.push(row);
  }
  if (!!pagination) {
    const { page, pageSize } = pagination;
    if (list.length > pageSize) {
      if (page === 1) {
        keyboard.push([
          { text: "Next page >>", callback_data: `${callbackDataPrefix}page-${page + 1}` },
        ]);
      } else if (page * pageSize >= list.length) {
        keyboard.push([
          { text: "<< Previous page", callback_data: `${callbackDataPrefix}page-${page - 1}` },
        ]);
      } else if (page > 1 && page * pageSize < list.length) {
        keyboard.push([
          { text: "<< Previous page", callback_data: `${callbackDataPrefix}page-${page - 1}` },
          { text: "Next page >>", callback_data: `${callbackDataPrefix}page-${page + 1}` },
        ]);
      }
    }
  }
  if (addBackButton) {
    keyboard.push([{ text: "<< back", callback_data: `${callbackDataPrefix}back` }]);
  }
  return keyboard;
};

export { createInlineKeyboard };
