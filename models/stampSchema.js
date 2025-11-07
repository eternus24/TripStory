const mongoose = require('mongoose')

const stampSchema = new mongoose.Schema({//new 실제 스키마 객체 생성
    userId:{type:String,required:true,index:true},
    location:{type:String,required:true},//지역
    regionCode:{type:String,required:true},
    date:{type:String},//획득일
    createdAt:{type:Date,default:Date.now}
})

//중복 스탬프 방지를 위한 복합 인덱스
stampSchema.index({userId:1,location:1},{unique:true})

console.log('스키마 정의');

//모델 정의

const StampModel = mongoose.model('stampdbs',stampSchema);

console.log('모델 정의');

module.exports = {
    stampSchema,
    StampModel
}
