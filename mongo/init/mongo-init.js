db.createUser(
        {
            user: "floki",
            pwd: "MisterFl0k",
            roles: [
                {
                    role: "readWrite",
                    db: "display"
                }
            ]
        }
);
