import { Client } from "minio";

export const BUCKET_NAME = "game-assets";

// TODO: MOVE THESE TO CONFIG
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: parseInt(process.env.MINIO_PORT ?? "9000"),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
});

async function ensureBucketPublic() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
  }

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["s3:GetObject"],
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
      },
    ],
  };

  await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
}

export async function getAllyBackgroundUploadUrl(
  backgroundId: string,
  expirySeconds = 300,
) {
  await ensureBucketPublic();
  const key = `allyBackgrounds/${backgroundId}.png`;

  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    key,
    expirySeconds,
  );

  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function getMapUploadUrl(mapId: string, expirySeconds = 300) {
  await ensureBucketPublic();
  const key = `maps/${mapId}.png`;

  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    key,
    expirySeconds,
  );

  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function getBattleBgUploadUrl(mapId: string, expirySeconds = 300) {
  await ensureBucketPublic();
  const key = `battleBgs/${mapId}.png`;

  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    key,
    expirySeconds,
  );

  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function getBannerUploadUrl(
  bannerId: string,
  expirySeconds = 300,
) {
  await ensureBucketPublic();
  const key = `banners/${bannerId}.png`;

  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    key,
    expirySeconds,
  );

  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function getEnemyUploadUrl(enemyId: string, expirySeconds = 300) {
  await ensureBucketPublic();
  const key = `enemies/${enemyId}.png`;

  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    key,
    expirySeconds,
  );

  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function getAllyUploadUrls(allyId: string) {
  await ensureBucketPublic();

  const exts = [".sprite.png", ".portrait.png"];
  const uploadUrls: Record<string, { uploadUrl: string; publicUrl: string }> =
    {};

  for (const ext of exts) {
    const objectKey = `allies/${allyId}${ext}`;
    const uploadUrl = await minioClient.presignedPutObject(
      BUCKET_NAME,
      objectKey,
    );
    uploadUrls[ext] = {
      uploadUrl,
      publicUrl: getPublicUrl(objectKey),
    };
  }

  return uploadUrls;
}

export function getPublicUrl(key: string) {
  const base = `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://localhost:9000`;
  return `${base}/${BUCKET_NAME}/${key}`;
}
