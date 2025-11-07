import api from '../assets/api/index'

const mytripService = {//실제 서버와 통신
    //여행 목록 조회
    async getTrips() {
        const {data} = await api.get('/mytrip/trip')
        return data
    },

    //여행 등록
    async addTrip(payload) {
        const {data} = await api.post('/mytrip/trip',payload)
        return data
    },

    //여행 수정
    async updateTrip(id,payload){
        const {data} = await api.put(`/mytrip/trip/${id}`,payload)
        return data
    },

    //여행 삭제
    async deleteTrip(id){
        const {data} = await api.delete(`/mytrip/trip/${id}`)
        return data
    },
    //승인 완료 처리
    async completeTrip(id){
        const{data} = await api.post(`/approval/complete/${id}`)
        return data
    },
}

export default mytripService