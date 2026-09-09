import mongoose from "mongoose";

const taskSchema=new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true,
            maxlength:100
        },
        description:{
            type:String,
            default:"",
            trim:true,
            maxlength:500
        },
        status:{
            type:String,
            enum:["pending","in-progress","completed"],
            default:"pending"
        },
        priority:{
            type:String,
            enum:["low","medium","high"],
            default:"medium"
        },
        dueDate:{
            type:Date,
            default:null
        },
        tags:{
            type:[String],
            default:[]
    }
},
{
    timestamps:true
}
);

const Task=mongoose.model("Task",taskSchema);

export default Task;