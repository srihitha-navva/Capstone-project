//AuthorAPI.js

import exp from 'express'
import { UserModel } from '../models/UserModel.js'
import { ArticleModel } from '../models/ArticleModel.js'
import { verifyToken } from '../middlewares/verifyToken.js'
export const authorApp=exp.Router()

//write article (protected route)
authorApp.post('/article',verifyToken("AUTHOR"),async(req,res) => {
    //get articleObj from client
    const articleObj=req.body
    //get user from  decoded token
    //console.log(req.user)
    let user=req.user
    //check author -- as we are not currently using client side application we check the validity again
    let author=await UserModel.findById(articleObj.author)
    //if author not found
    if(!author)
        return res.status(404).json({message:"Invalid author"})
    if(author.email!==user.email)
        return res.status(403).json({message:"You are not authorized"})
    //create article by document
    const articleDocument=new ArticleModel(articleObj)
    //save
    await articleDocument.save()
    //send res
    res.status(201).json({message:"Article published successfully",payload:articleDocument})
})

//read own articles
authorApp.get('/articles',verifyToken("AUTHOR"),async(req,res) => {
    //get author id from decoded token
    const authorIdOfToken=req.user?.id
    //get articles by author id
    const articleList=await ArticleModel.find({author:authorIdOfToken})
    //send res
    res.status(200).json({message:"Articles:",payload:articleList})
})

//edit article 
authorApp.put('/articles',verifyToken("AUTHOR"),async(req,res) => {
    //get author id from decoded token
    const authorIdOfToken=req.user?.id
    //get modified article from client
    const {articleId,title,category,content}=req.body //{articleId,title,category,content}
    //get articles by auothor id
    const modifiedArticle=await ArticleModel.findOneAndUpdate(
        {_id:articleId,author:authorIdOfToken},
        {$set:{title,category,content}},
        {returnDocument:'after'})
    //if either article id or author not correct
    if(!modifiedArticle)
        return res.status(403).json({message:"Not authorized to edit artcile"})
    //send res
    res.status(200).json({message:"Article modified",payload:modifiedArticle})

})

//delete article -- soft delete
authorApp.patch('/articles',verifyToken("AUTHOR"),async(req,res) => {
    //get author id from decodedToken
    const authorIdOfToken=req.user?.id
    //get modifies article from client
    const {articleId,isArticleActive}=req.body
    //get article by id
    const articleOfDB=await ArticleModel.findOne({_id:articleId,author:authorIdOfToken})
    if(!articleOfDB)
        return res.status(403).json({message:"You are not authorized to modify this article"})
    //check status
    if(isArticleActive===articleOfDB.isArticleActive)
        return res.status(200).json({message:"Article already in the same state"})
    //update the status with status recived by the req 
    articleOfDB.isArticleActive=isArticleActive
    await articleOfDB.save()
    //send res
    res.status(200).json({message:"Artcile modified",payload:articleOfDB})
})
