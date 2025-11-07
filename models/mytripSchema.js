const mongoose = require('mongoose')

//여행 기록 스키마 정의
const mytripSchema = new mongoose.Schema({
    userId: {type:String,required:true,index:true},
    location:{type:String,required:true},//지역
    title:{type:String,required:true},//제목
    date:{type:String,required:true},//날짜
    content:{type:String,default:''},//내용
    createdAt:{type:Date,default:Date.now},
    hashtags:[{type:String}],//해시태그
})

console.log('스키마 정의');

//모델 정의
mongoose.model('mytripdbs',mytripSchema);

console.log('모델 정의');