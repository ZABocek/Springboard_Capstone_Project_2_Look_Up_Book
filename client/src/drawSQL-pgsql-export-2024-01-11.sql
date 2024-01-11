CREATE TABLE "user_book"(
    "book_id" SERIAL NOT NULL,
    "user_id" SERIAL NOT NULL
);
ALTER TABLE
    "user_book" ADD CONSTRAINT "user_book_book_id_unique" UNIQUE("book_id");
ALTER TABLE
    "user_book" ADD CONSTRAINT "user_book_user_id_unique" UNIQUE("user_id");
CREATE TABLE "author"(
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "elite_univ" TEXT NULL,
    "grad_school" BOOLEAN NOT NULL,
    "mfa_degree" BOOLEAN NOT NULL
);
ALTER TABLE
    "author" ADD PRIMARY KEY("id");
CREATE TABLE "user"(
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
ALTER TABLE
    "user" ADD PRIMARY KEY("id");
ALTER TABLE
    "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
ALTER TABLE
    "user" ADD CONSTRAINT "user_password_unique" UNIQUE("password");
CREATE TABLE "book_award"(
    "book_id" SERIAL NOT NULL,
    "award_id" SERIAL NOT NULL
);
ALTER TABLE
    "book_award" ADD CONSTRAINT "book_award_book_id_unique" UNIQUE("book_id");
ALTER TABLE
    "book_award" ADD CONSTRAINT "book_award_award_id_unique" UNIQUE("award_id");
CREATE TABLE "user_book_likes"(
    "like_id" SERIAL NOT NULL,
    "book_id" SERIAL NOT NULL,
    "user_id" SERIAL NOT NULL,
    "likedOn" DATE NOT NULL
);
ALTER TABLE
    "user_book_likes" ADD PRIMARY KEY("like_id");
ALTER TABLE
    "user_book_likes" ADD CONSTRAINT "user_book_likes_book_id_unique" UNIQUE("book_id");
ALTER TABLE
    "user_book_likes" ADD CONSTRAINT "user_book_likes_user_id_unique" UNIQUE("user_id");
CREATE TABLE "book"(
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "year_published" DATE NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "author_id" SERIAL NOT NULL
);
ALTER TABLE
    "book" ADD PRIMARY KEY("id");
ALTER TABLE
    "book" ADD CONSTRAINT "book_author_id_unique" UNIQUE("author_id");
CREATE TABLE "award"(
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "award_amount" BIGINT NOT NULL,
    "year" DATE NOT NULL
);
ALTER TABLE
    "award" ADD PRIMARY KEY("id");
ALTER TABLE
    "book_award" ADD CONSTRAINT "book_award_book_id_foreign" FOREIGN KEY("book_id") REFERENCES "book"("id");
ALTER TABLE
    "user_book" ADD CONSTRAINT "user_book_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");
ALTER TABLE
    "user_book_likes" ADD CONSTRAINT "user_book_likes_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");
ALTER TABLE
    "book_award" ADD CONSTRAINT "book_award_award_id_foreign" FOREIGN KEY("award_id") REFERENCES "award"("id");
ALTER TABLE
    "user_book" ADD CONSTRAINT "user_book_book_id_foreign" FOREIGN KEY("book_id") REFERENCES "book"("id");
ALTER TABLE
    "user_book_likes" ADD CONSTRAINT "user_book_likes_book_id_foreign" FOREIGN KEY("book_id") REFERENCES "book"("id");
ALTER TABLE
    "book" ADD CONSTRAINT "book_author_id_foreign" FOREIGN KEY("author_id") REFERENCES "author"("id");