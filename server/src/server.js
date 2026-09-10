import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import taskRoutes from "./routes/task_routes.js";
import authRoutes from "./routes/auth_routes.js";
import { connectDatabase } from './config/database.js';

const app=express();
const PORT=process.env.PORT;
const allowedOrigin=process.env.CORS_ORIGIN;
app.use(cors({
    origin: allowedOrigin
}));
app.use(express.json());

app.get("/api/health",(req,res)=>{
res.status(200).json({
    success:true,
    message:"API is working fine"
});
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

async function startServer(){
    try{
        await connectDatabase();
        app.listen(PORT,()=>{
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}

startServer();