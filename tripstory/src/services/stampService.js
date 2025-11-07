import api from '../assets/api/index'//사용자 요청용

const stampService = {
    //목록 조회
    async getStamps(){
        const{data} = await api.get('/stamp/list')
        return data
    },

    //지역별 방문 횟수 조회
    async getVisitCount(){
        const{data} = await api.get('/stamp/visitCount')
        return data
    },

    //사용자 등급 조회
    async getUserGrade(){
        const {data} = await api.get('/stamp/userGrade')
        return data
    },

    //스탬프 추가
    async addStamp(payload){
        const{data} = await api.post('/stamp/add',payload)
        return data
    }
    
}

export default stampService