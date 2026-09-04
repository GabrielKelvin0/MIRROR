import "server-only";
import { prisma } from "@/lib/db";
import type { UserRole, StrategyStatus, ReportStatus } from "@prisma/client";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { assertTransition } from "@/lib/services/strategy-rules";
export class AdminRepository {
 async listUsers(){return prisma.user.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{strategies:true}}}})}
 async listCreators(){return prisma.user.findMany({where:{role:"CREATOR"},orderBy:{createdAt:"desc"},include:{creatorProfile:true,_count:{select:{strategies:true}}}})}
 async listStrategies(status?:StrategyStatus){const where=status?{status}:{ };return prisma.strategy.findMany({where,orderBy:{updatedAt:"desc"},include:{creator:{select:{id:true,firstName:true,lastName:true,email:true}}}})}
 async listReports(){return prisma.report.findMany({orderBy:{createdAt:"desc"},include:{reporter:{select:{firstName:true,lastName:true,email:true}}}})}
 async changeRole(actorId:string,targetId:string,role:UserRole){if(!Object.values({LEARNER:"LEARNER",CREATOR:"CREATOR",ADMIN:"ADMIN"}).includes(role))throw new BusinessRuleError("Invalid role");const target=await prisma.user.findUnique({where:{id:targetId},select:{id:true,role:true}});if(!target)throw new NotFoundError("User not found");if(target.id===actorId&&role!=="ADMIN")throw new BusinessRuleError("You cannot remove your own admin access");if(target.role==="ADMIN"&&role!=="ADMIN"&&await prisma.user.count({where:{role:"ADMIN"}})<=1)throw new BusinessRuleError("The final administrator cannot be demoted");return prisma.user.update({where:{id:targetId},data:{role}})}
 async moderateStrategy(adminId:string,strategyId:string,to:StrategyStatus){const s=await prisma.strategy.findUnique({where:{id:strategyId},select:{id:true,status:true}});if(!s)throw new NotFoundError("Strategy not found");assertTransition(s.status,to);const data={status:to,...(to==="PUBLISHED"?{publishedAt:new Date()}:to==="DRAFT"?{publishedAt:null}: {})};const u=await prisma.$transaction(async tx=>{const updated=await tx.strategy.update({where:{id:strategyId},data});await tx.auditLog.create({data:{userId:adminId,action:"ADMIN_STRATEGY_STATUS",resourceType:"STRATEGY",resourceId:strategyId,changes:JSON.stringify({from:s.status,to})}});return updated});return u}
 async resolveReport(adminId:string,reportId:string,status:ReportStatus){if(!["OPEN","INVESTIGATING","RESOLVED","DISMISSED"].includes(status))throw new BusinessRuleError("Invalid report status");const r=await prisma.report.findUnique({where:{id:reportId}});if(!r)throw new NotFoundError("Report not found");await prisma.$transaction(async tx=>{await tx.report.update({where:{id:reportId},data:{status}});await tx.moderationAction.create({data:{adminId,reportId,resourceType:r.resourceType,resourceId:r.resourceId,action:status==="DISMISSED"?"RESTORE":"WARN",reason:"Report status changed to "+status}})});
 }
}
export const adminRepository=new AdminRepository();
