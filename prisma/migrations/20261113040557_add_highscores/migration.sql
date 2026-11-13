-- CreateTable
CREATE TABLE "highscores" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "game_name" TEXT NOT NULL,
    "top1_name" TEXT,
    "top1_score" INTEGER,
    "top2_name" TEXT,
    "top2_score" INTEGER,
    "top3_name" TEXT,
    "top3_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "highscores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "highscores_game_id_key" ON "highscores"("game_id");
