const cleanHtml = html => html ?
  html
    .replace(/<img .* \/>/g, "")
    .replace(/<a.*<\/a>/g, "")
    .replace(/&hellip;/g, "")
    .replace(/&nbsp;/g, "") : undefined;

module.exports = { cleanHtml };
