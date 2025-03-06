import { index } from "./uploadService";

export const deleteData = async () => {
  await index.namespace("ns1").deleteAll();
};
