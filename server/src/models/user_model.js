import mongoose from "mongoose";
import passportLocalMongoosePackage from "passport-local-mongoose";

const passportLocalMongoose =
    passportLocalMongoosePackage.default ||
    passportLocalMongoosePackage;
    
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
);

userSchema.plugin(passportLocalMongoose, {
    usernameField: "email",
    usernameLowerCase: true
});

const User = mongoose.model("User", userSchema);

export default User;