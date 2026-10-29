import { afterEach, describe, expect, it } from "vitest";
import { resolveS3Endpoint } from "./s3";

describe("resolveS3Endpoint", () => {
  const prev = {
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PUBLIC_ENDPOINT: process.env.S3_PUBLIC_ENDPOINT,
  };

  afterEach(() => {
    if (prev.S3_ENDPOINT === undefined) delete process.env.S3_ENDPOINT;
    else process.env.S3_ENDPOINT = prev.S3_ENDPOINT;
    if (prev.S3_PUBLIC_ENDPOINT === undefined) {
      delete process.env.S3_PUBLIC_ENDPOINT;
    } else {
      process.env.S3_PUBLIC_ENDPOINT = prev.S3_PUBLIC_ENDPOINT;
    }
  });

  it("internal usa S3_ENDPOINT; strip trailing slash", () => {
    process.env.S3_ENDPOINT = "http://seaweedfs:8333/";
    process.env.S3_PUBLIC_ENDPOINT = "https://s3.example.com/";
    expect(resolveS3Endpoint("internal")).toBe("http://seaweedfs:8333");
  });

  it("presign preferisce S3_PUBLIC_ENDPOINT (SigV4 host)", () => {
    process.env.S3_ENDPOINT = "http://seaweedfs:8333";
    process.env.S3_PUBLIC_ENDPOINT = "https://s3.example.com/";
    expect(resolveS3Endpoint("presign")).toBe("https://s3.example.com");
  });

  it("presign cade su internal se PUBLIC assente", () => {
    process.env.S3_ENDPOINT = "http://localhost:8333";
    delete process.env.S3_PUBLIC_ENDPOINT;
    expect(resolveS3Endpoint("presign")).toBe("http://localhost:8333");
  });
});
