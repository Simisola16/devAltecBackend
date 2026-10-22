"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), 'backend/.env') });
dotenv_1.default.config();
const connectDB = async () => {
    const uri = process.env.MONGODB_URI ||
        'mongodb+srv://olamilekanmuhayad_db_user:aKqWBYlFiglZTB42@devaltecv.zhhbtid.mongodb.net/devaltec?retryWrites=true&w=majority&appName=DevAltecV';
    try {
        const conn = await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('[MongoDB] Connection error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
