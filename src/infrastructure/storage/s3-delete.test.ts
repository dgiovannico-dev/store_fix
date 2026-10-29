import { DeleteObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import { deleteAttachmentObject } from "./s3";

describe("deleteAttachmentObject", () => {
  it("invia DeleteObjectCommand con bucket/key", async () => {
    process.env.S3_BUCKET = "facilityflow-attachments";
    const send = vi.fn(async () => ({}));
    const client = { send } as unknown as S3Client;

    await deleteAttachmentObject("tenants/t1/tickets/tk/a.jpg", client);

    expect(send).toHaveBeenCalledTimes(1);
    const cmd = send.mock.calls[0]?.[0];
    expect(cmd).toBeInstanceOf(DeleteObjectCommand);
    expect(cmd).toMatchObject({
      input: {
        Bucket: "facilityflow-attachments",
        Key: "tenants/t1/tickets/tk/a.jpg",
      },
    });
  });
});
