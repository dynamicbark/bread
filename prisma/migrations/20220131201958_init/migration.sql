-- CreateTable
CREATE TABLE "Usage" (
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "EnabledChannel" (
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "CachedUser" (
    "id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "discriminator" INTEGER NOT NULL,
    "last_update" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usage_guild_id_channel_id_user_id_key" ON "Usage"("guild_id", "channel_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnabledChannel_guild_id_channel_id_key" ON "EnabledChannel"("guild_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "CachedUser_id_key" ON "CachedUser"("id");

-- AddForeignKey
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "CachedUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
