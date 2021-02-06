CREATE ROLE admin WITH LOGIN PASSWORD '011235813';

ALTER ROLE admin CREATEDB;

-d postgres -U admin;

CREATE DATABASE bookshare;

create extension "uuid-ossp";

CREATE TABLE "Users" (
    "ID" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "FirstName" varchar(255)   NOT NULL,
    "LastName" varchar(255)   NOT NULL,
    "Email" varchar(255)   NOT NULL,
    "UserName" varchar(255)   NOT NULL,
    "Contact" varchar(20),
    "Password" varchar(255)   NOT NULL,
    "Blocked" boolean,
    "LastActive" timestamp,
    "CreatedAt" timestamp NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "DeletedAt" timestamp,
    CONSTRAINT "pk_Users" PRIMARY KEY (
        "ID"
     ),
    CONSTRAINT "uc_Users_UserName" UNIQUE (
        "UserName"
    )
);

CREATE TABLE "Books" (
    "ID" serial NOT NULL,
    "UserId" uuid NOT NULL,
    "Title" varchar(255)   NOT NULL,
    "Author" varchar(255),
    "PublishDate" date,
    "Description" varchar(1000),
    "Image_url" : varchar(2083),
    "Genre" int  NOT NULL,
    "Level" int   NOT NULL,
    "ISBN" varchar(14),
    "Available" boolean DEFAULT TRUE,
    "Price" int NOT NULL DEFAULT 0,
    "Location" varchar(255)   NOT NULL,
    "CreatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "DeletedAt" timestamp,
    CONSTRAINT "pk_Books" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Notification" (
    "ID" serial  NOT NULL,
    "UserId" uuid  NOT NULL,
    "Message" varchar(300) NOT NULL,
    "Viewed" boolean NOT NULL DEFAULT FALSE,
    "DeletedAt" timestamp,
    "AddedAt" timestamp   NOT NULL DEFAULT NOW(),
    "ViewedAt" timestamp,
    CONSTRAINT "pk_Notification" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Genres" (
    "ID" serial   NOT NULL,
    "Name" varchar(255)   NOT NULL,
    "Description" varchar(1000),
    CONSTRAINT "pk_Genres" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Levels" (
    "ID" serial   NOT NULL,
    "Name" varchar(255)   NOT NULL,
    "Description" varchar(1000),
    CONSTRAINT "pk_Levels" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Favourites" (
    "UserId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "AddedAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_Favourites" PRIMARY KEY (
        "UserId","BookId"
     )
);

CREATE TABLE "Viewed" (
    "ID" serial NOT NULL,
    "UserId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "ViewedAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_Viewed" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Given_Away" (
    "ownerId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "IssuedAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_Given_away" PRIMARY KEY (
        "ownerId","BookId"
     )
);

CREATE TABLE "Reports" (
    "ID" uuid   NOT NULL,
    "IssuedFrom" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "Type" int   NOT NULL,
    "Description" varchar(500),
    "Reviewed" boolean  NOT NULL DEFAULT FALSE,
    "CreatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "ReviewedAt" timestamp,
    CONSTRAINT "pk_Reports" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "ReportTypes" (
    "ID" serial  NOT NULL,
    "Name" varchar(255)   NOT NULL,
    "Description" varchar(500),
    CONSTRAINT "pk_ReportTypes" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

ALTER TABLE "Books" ADD CONSTRAINT "fk_Books_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Books" ADD CONSTRAINT "fk_Books_Genre" FOREIGN KEY("Genre")
REFERENCES "Genres" ("ID");

ALTER TABLE "Books" ADD CONSTRAINT "fk_Books_Level" FOREIGN KEY("Level")
REFERENCES "Levels" ("ID");

ALTER TABLE "Notification" ADD CONSTRAINT "fk_Notification_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Favourites" ADD CONSTRAINT "fk_Favourites_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Favourites" ADD CONSTRAINT "fk_Favourites_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Viewed" ADD CONSTRAINT "fk_Viewed_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Viewed" ADD CONSTRAINT "fk_Viewed_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Given_Away" ADD CONSTRAINT "fk_Given_away_ownerId" FOREIGN KEY("ownerId")
REFERENCES "Users" ("ID");

ALTER TABLE "Given_Away" ADD CONSTRAINT "fk_Given_away_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Given_Away" ADD CONSTRAINT "fk_Given_away_IssuedTo" FOREIGN KEY("IssuedTo")
REFERENCES "Users" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_IssuedFrom" FOREIGN KEY("IssuedFrom")
REFERENCES "Users" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_Type" FOREIGN KEY("Type")
REFERENCES "ReportTypes" ("ID");