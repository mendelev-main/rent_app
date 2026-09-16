import type {FastifyInstance} from 'fastify';
import {db,upsertTelegramUser} from './database.js';
import {validateTelegramInitData} from './telegram-auth.js';

function needDb(){if(!db)throw new Error('DATABASE_URL is not configured');return db}
function normalizePhone(value:string){const v=value.trim();return v.startsWith('+')?v:'+'+v}

export function registerTelegramContact(app:FastifyInstance,botToken:string){
 app.post<{Body:{initData?:string}}>('/api/profile/phone',async(r,reply)=>{try{const telegram=validateTelegramInitData(r.body?.initData??'',botToken);const user=await upsertTelegramUser(telegram);const q=await needDb().query<{phone_number:string|null}>('select phone_number from public.users where id=$1',[user.id]);return{ok:true,phone_number:q.rows[0]?.phone_number??null}}catch(e){r.log.error(e);return reply.code(401).send({ok:false,error:'Authorization failed'})}});
 app.post<{Body:{message?:{from?:{id?:number};contact?:{phone_number?:string;user_id?:number}}}}>('/telegram/webhook',async(r,reply)=>{try{const m=r.body?.message,fromId=m?.from?.id,contact=m?.contact;if(fromId&&contact?.phone_number&&contact.user_id===fromId){await needDb().query('update public.users set phone_number=$2,updated_at=now() where telegram_user_id=$1',[fromId,normalizePhone(contact.phone_number)])}return reply.send({ok:true})}catch(e){r.log.error(e);return reply.code(500).send({ok:false})}});
}

export async function configureTelegramWebhook(botToken:string,publicAppUrl:string,log:{info:(o:unknown,m?:string)=>void;error:(o:unknown,m?:string)=>void}){if(!botToken||!publicAppUrl)return;try{const url=publicAppUrl.replace(/\/$/,'')+'/telegram/webhook';const r=await fetch('https://api.telegram.org/bot'+botToken+'/setWebhook',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,allowed_updates:['message'],drop_pending_updates:false})});const data=await r.json();if(!r.ok||(data as {ok?:boolean}).ok!==true)throw new Error('Telegram setWebhook failed');log.info({url},'Telegram webhook configured')}catch(e){log.error(e,'Telegram webhook configuration failed')}}