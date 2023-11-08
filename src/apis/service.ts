import Axios from 'axios';

const instance = Axios.create({
  // 实例配置
  baseURL: '/', // 可以在环境变量中配置，dev走相对路径proxy，build走绝对路径请求
  withCredentials: true,
  timeout: 80000,
});
console.log(instance);
