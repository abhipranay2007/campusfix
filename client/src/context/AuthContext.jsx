import {createContext,useContext,useEffect,useState} from 'react';import {api} from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{api('/auth/me').then(d=>setUser(d.user)).catch(()=>setUser(null)).finally(()=>setLoading(false))},[]);
 async function login(email,password){const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});setUser(d.user)}
 async function register(name,email,password){const d=await api('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});setUser(d.user)}
 async function logout(){try{await api('/auth/logout',{method:'POST'})}finally{setUser(null)}}
 return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
