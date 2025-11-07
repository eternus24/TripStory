const mongoose = require('mongoose')

const imageSchema = mongoose.Schema({
    originalFileName:{type:String},
    saveFileName:{type:String},
    path:{type:String}

})

console.log('이미지 스키마 정의');

mongoose.model('imagedbs',imageSchema);

console.log('이미지 모델 정의');