CREATE ROLE admin WITH LOGIN PASSWORD '011235813';

ALTER ROLE admin CREATEDB;

-d postgres -U admin;

CREATE DATABASE bookshare;

\c bookshare

create extension "uuid-ossp";

CREATE TABLE "Users" (
    "ID" uuid   NOT NULL DEFAULT uuid_generate_v4(),
    "FirstName" varchar(255)   NOT NULL,
    "LastName" varchar(255)   NOT NULL,
    "Email" varchar(255)   NOT NULL,
    "UserName" varchar(255)   NOT NULL,
    "PhoneNumber" varchar(20),
    "Password" varchar(255)   NOT NULL,
    "ActiveAt" timestamp,
    "CreatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "DeletedAt" timestamp,
    "BlockedAt" timestamp,
    CONSTRAINT "pk_Users" PRIMARY KEY (
        "ID"
     ),
    CONSTRAINT "uc_Users_UserName" UNIQUE (
        "UserName"
    )
);

CREATE TABLE "Books" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "UserId" uuid   NOT NULL,
    "Title" varchar(255)   NOT NULL,
    "Author" varchar(255),
    "PublishDate" date,
    "Description" varchar(1000),
    "Image_url" varchar(2083),
    "Genre" int NOT NULL,
    "ISBN" varchar(14),
    "IsAvailable" boolean NOT NULL DEFAULT TRUE,
    "Price" float   NOT NULL DEFAULT 0,
    "PriceCurrency" varchar(3)   NOT NULL DEFAULT 'LBP',
    "Location" varchar(255),
    "CreatedAt" timestamp   NOT NULL DEFAULT NOW(),
    "DeletedAt" timestamp,
    CONSTRAINT "pk_Books" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Notification" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "UserId" uuid   NOT NULL,
    "Message" varchar(300)   NOT NULL,
    "DeletedAt" timestamp,
    "AddedAt" timestamp NOT NULL DEFAULT NOW(),
    "ViewedAt" timestamp,
    CONSTRAINT "pk_Notification" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Genres" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "Name" varchar(255)   NOT NULL,
    "Description" varchar(1000),
    CONSTRAINT "pk_Genres" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Saved" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "UserId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "AddedAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_Saved" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "Viewed" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "UserId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "ViewedAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_Viewed" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "GivenAway" (
    "OwnerId" uuid   NOT NULL,
    "BookId" int   NOT NULL,
    "GivenAt" timestamp   NOT NULL DEFAULT NOW(),
    CONSTRAINT "pk_GivenAway" PRIMARY KEY (
        "OwnerId","BookId"
     )
);

CREATE TABLE "Reports" (
    "ID" uuid   NOT NULL,
    "IssuedBy" uuid   NOT NULL,
    "BookID" int   NOT NULL,
    "Type" int   NOT NULL,
    "Description" varchar(500)   NOT NULL,
    "IssuedAt" timestamp   NOT NULL DEFAULT NOW(),
    "ReviewedAt" timestamp   NOT NULL,
    CONSTRAINT "pk_Reports" PRIMARY KEY (
        "ID"
     )
);

CREATE TABLE "ReportTypes" (
    "ID" int GENERATED ALWAYS AS IDENTITY,
    "Name" varchar(255)   NOT NULL,
    "Description" varchar(500)   NOT NULL,
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

ALTER TABLE "Notification" ADD CONSTRAINT "fk_Notification_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Saved" ADD CONSTRAINT "fk_Saved_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Saved" ADD CONSTRAINT "fk_Saved_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Viewed" ADD CONSTRAINT "fk_Viewed_UserId" FOREIGN KEY("UserId")
REFERENCES "Users" ("ID");

ALTER TABLE "Viewed" ADD CONSTRAINT "fk_Viewed_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "GivenAway" ADD CONSTRAINT "fk_GivenAway_OwnerId" FOREIGN KEY("OwnerId")
REFERENCES "Users" ("ID");

ALTER TABLE "GivenAway" ADD CONSTRAINT "fk_GivenAway_BookId" FOREIGN KEY("BookId")
REFERENCES "Books" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_IssuedBy" FOREIGN KEY("IssuedBy")
REFERENCES "Users" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_BookID" FOREIGN KEY("BookID")
REFERENCES "Books" ("ID");

ALTER TABLE "Reports" ADD CONSTRAINT "fk_Reports_Type" FOREIGN KEY("Type")
REFERENCES "ReportTypes" ("ID");

CREATE VIEW "AvailableBooks" as
	SELECT B."ID", B."Title", B."Author", B."PublishDate", B."Description", B."Image_url",
           B."ISBN", B."Price", B."PriceCurrency", B."Location", B."CreatedAt" , 
           G."Name" as "Genre", U."UserName"
	FROM ("Books" B INNER JOIN "Genres" G ON B."Genre" = G."ID") INNER JOIN "Users" U ON U."ID" = B."UserId"
	WHERE B."IsAvailable" = True AND B."DeletedAt" IS NULL AND U."DeletedAt" IS NULL;

CREATE VIEW "DeletedBooks" as 
    SELECT *
    FROM "Books"
    WHERE "Books"."DeletedAt" IS NOT NULL;

CREATE VIEW "NotDeletedBooks" as
    SELECT *
    FROM "Books"
    WHERE "Books"."DeletedAt" IS NULL;

CREATE VIEW "GetBooks" as
	SELECT "AvailableBooks"."ID", "AvailableBooks"."Title", "AvailableBooks"."Author"
    FROM "AvailableBooks"
    ORDER BY "AvailableBooks"."CreatedAt" DESC ;