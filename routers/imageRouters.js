const multer = require('multer')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const Images = mongoose.model('imagedbs')

//파일 업로드 폴더 제작
try{//있으면 파일 내 경로 읽고, 없을 경우 파일 제작
    fs.readdirSync('uploads')
}catch(error){
    fs.mkdirSync('uploads')
}

const fileUploadRouters = (app,router) => {
    const storage = multer.diskStorage({
        destination:(req,fileUpload,callback)=>{//파일 위치
            callback(null,'uploads')
        },
        filename:(req,fileUpload,callback)=>{//파일 이름 설정(중복방지)
            callback(null,Date.now().toString()+path.extname(fileUpload.originalname))
        }
    })

    var uploads = multer({
        storage:storage,
        limits:{
            files:10,//10개까지 저장가능
            fileSize:1024*1024*1024 //1기가 업로드
        }
    })

    //router 추가 - 한번에 하나씩 파일 업로드
    router.route('/api/fileUpload').post(uploads.array('upload',1),(req,res)=>{
        const files = req.files

        let originalName = ''
        let saveName = ''

        if(Array.isArray(files)){

            for(let i=0;i<files.length;i++){
                originalName = encoding(files[i].originalname)
                saveName = files[i].filename
                
                //db 전달
                Images.create({
                    originalFileName:originalName,
                    saveFileName:saveName,
                    path:'http://192.168.0.20:8080/' + saveName
                })

            }
        }
        return res.status(200).send()

    })
    //router app 등록
    app.use('/',router)

}
//한글 파일이름 깨짐 방지
function encoding(fileName){
    return Buffer.from(fileName,'latin1').toString('utf8')
}

//외부에서 사용할 수 있게 작성
module.exports = fileUploadRouters