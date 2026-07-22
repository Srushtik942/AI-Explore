import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, index: true },
    title: {
    type: String,
},
content:{
    type: String,
    required: true
},
coverImage:{
    type: String
},
images:[
    {type: String}
],
source:{
    type: String,
    enum:[
        "ai_generated",
        "user_generated"
    ],
    required: true
},
authorId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
},
tags:[
    {type: String}
],
seoMeta: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
   publishedAt: {type: Date},
},
{
timestamps: true
}
);

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;