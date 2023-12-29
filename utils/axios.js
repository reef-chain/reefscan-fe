import axios from 'axios'
import { network } from '~/frontend.config'

const axiosInstance = axios.create({
  baseURL: network.backendHttp,
})

export default axiosInstance
