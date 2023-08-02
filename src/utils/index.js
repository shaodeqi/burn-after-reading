export * from './string';
export * from "./constants"

export const type = (content) =>
  Object.prototype.toString.call(content).slice(8, -1);

export const handleMessageData = async (data) => {
  let payloadStr = data;
  if (type(data) === 'Blob') {
    payloadStr = await data.text();
  }
  let payload = {};
  try {
    payload = JSON.parse(payloadStr);
  } catch (e) {
    console.error(e);
  }
  return payload;
};