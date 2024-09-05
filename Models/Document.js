const mongoose=require('mongoose');
const DocumentSchema=new mongoose.Schema({
    title:{type:String,required:true},
    text:{type:String,required:true},
    uploadAt: {type:Date,default:Date.Now}

});

module.exports=mongoose.model('Document',DocumentSchema);
mongoose.connect('mongodb://localhost/plagiarism_checker')
.catch(err => {
    console.error('connection error:,err')
});