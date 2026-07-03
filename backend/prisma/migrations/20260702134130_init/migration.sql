-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skills" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "permission_name" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_time" TIMESTAMP(3),
    "ip_address" TEXT,
    "device_info" TEXT,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "brand_name" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "client_status" TEXT NOT NULL DEFAULT 'Active',
    "onboarding_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "retainer_value" DOUBLE PRECISION,
    "service_type" TEXT,
    "account_manager_id" UUID,
    "primary_contact_name" TEXT,
    "spoc_name" TEXT,
    "internal_notes" TEXT,
    "brand_shortcode" TEXT,
    "logo" TEXT,
    "objective" TEXT,
    "focused_area" TEXT,
    "customer_mindset" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientUser" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "birth_date" TIMESTAMP(3),
    "anniversary_date" TIMESTAMP(3),
    "festival_greetings" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSpoc" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "role_type" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSpoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" UUID,
    "assigned_by" UUID NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "due_date" TIMESTAMP(3),
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "delay_reason" TEXT,
    "delay_notes" TEXT,
    "original_due_date" TIMESTAMP(3),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "recurrence_end" TIMESTAMP(3),
    "resource_links" TEXT[],
    "checklist" JSONB,
    "estimated_hours" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "review_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "department" TEXT,
    "is_sow" BOOLEAN NOT NULL DEFAULT false,
    "sow_id" UUID,
    "sow_item_id" UUID,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "communication_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "summary" TEXT,
    "next_action" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "owner_id" UUID,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "meeting_title" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT,
    "agenda" TEXT,
    "discussion_points" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "action_item" TEXT NOT NULL,
    "assigned_to" UUID,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sow" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "sow_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SowMonth" (
    "id" UUID NOT NULL,
    "sow_id" UUID NOT NULL,
    "month_year" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SowMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SowItem" (
    "id" UUID NOT NULL,
    "sow_id" UUID NOT NULL,
    "sow_month_id" UUID,
    "deliverable_name" TEXT NOT NULL,
    "frequency" TEXT,
    "owner_id" UUID,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "tracking_month" TEXT,

    CONSTRAINT "SowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "report_month" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "issue_description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "assigned_to" UUID,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientHealthScore" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "communication_score" INTEGER NOT NULL DEFAULT 0,
    "task_completion_score" INTEGER NOT NULL DEFAULT 0,
    "escalation_score" INTEGER NOT NULL DEFAULT 0,
    "report_timeliness_score" INTEGER NOT NULL DEFAULT 0,
    "overall_score" INTEGER NOT NULL DEFAULT 0,
    "risk_level" TEXT NOT NULL DEFAULT 'Stable',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "module_name" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "reference_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeAsset" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "task_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "internal_status" TEXT NOT NULL DEFAULT 'Draft',
    "client_status" TEXT NOT NULL DEFAULT 'Pending',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeAssetVersion" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeAssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAnnotation" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "x_percent" DOUBLE PRECISION NOT NULL,
    "y_percent" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "user_id" UUID,
    "client_user_id" UUID,
    "created_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklist" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "step_name" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialHandle" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "access_provided" TEXT NOT NULL,

    CONSTRAINT "SocialHandle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoAccess" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "access_provided" TEXT NOT NULL,

    CONSTRAINT "SeoAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaidMediaAccess" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "ad_account_id" TEXT,
    "profile_url" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "access_provided" TEXT NOT NULL,

    CONSTRAINT "PaidMediaAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" UUID NOT NULL,
    "holiday_name" TEXT NOT NULL,
    "holiday_date" TIMESTAMP(3) NOT NULL,
    "is_national" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "leave_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignPerformance" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads_conversions" INTEGER NOT NULL DEFAULT 0,
    "cost_per_lead_inr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "spend_inr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "start_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" UUID NOT NULL,
    "weekly_report_day" INTEGER NOT NULL DEFAULT 5,
    "weekly_report_time" TEXT NOT NULL DEFAULT '17:00',
    "email_subject_template" TEXT NOT NULL DEFAULT 'Weekly Activity Report: {company_name}',
    "email_intro_message" TEXT,
    "include_campaigns" BOOLEAN NOT NULL DEFAULT true,
    "include_tasks" BOOLEAN NOT NULL DEFAULT true,
    "include_communications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDeliveryLog" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "ReportDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMonthlyPlan" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "document_link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMonthlyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "tags" TEXT[],
    "embedding" DOUBLE PRECISION[],
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTracker" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary_text" TEXT,
    "status_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRequest" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Acceptance',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "estimated_hours" DOUBLE PRECISION,
    "due_date" TIMESTAMP(3),
    "requested_by" UUID NOT NULL,
    "assigned_to" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "client_id" UUID,
    "sow_id" UUID,
    "tags" TEXT[],
    "notes" TEXT,
    "attachment_urls" TEXT[],

    CONSTRAINT "WorkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_permission_name_key" ON "Permission"("permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_email_key" ON "ClientUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTracker_client_id_department_date_key" ON "DailyTracker"("client_id", "department", "date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUser" ADD CONSTRAINT "ClientUser_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSpoc" ADD CONSTRAINT "ClientSpoc_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSpoc" ADD CONSTRAINT "ClientSpoc_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sow_id_fkey" FOREIGN KEY ("sow_id") REFERENCES "Sow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sow_item_id_fkey" FOREIGN KEY ("sow_item_id") REFERENCES "SowItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sow" ADD CONSTRAINT "Sow_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowMonth" ADD CONSTRAINT "SowMonth_sow_id_fkey" FOREIGN KEY ("sow_id") REFERENCES "Sow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowItem" ADD CONSTRAINT "SowItem_sow_id_fkey" FOREIGN KEY ("sow_id") REFERENCES "Sow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowItem" ADD CONSTRAINT "SowItem_sow_month_id_fkey" FOREIGN KEY ("sow_month_id") REFERENCES "SowMonth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientHealthScore" ADD CONSTRAINT "ClientHealthScore_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAssetVersion" ADD CONSTRAINT "CreativeAssetVersion_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "CreativeAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAssetVersion" ADD CONSTRAINT "CreativeAssetVersion_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAnnotation" ADD CONSTRAINT "AssetAnnotation_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "CreativeAssetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAnnotation" ADD CONSTRAINT "AssetAnnotation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAnnotation" ADD CONSTRAINT "AssetAnnotation_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "ClientUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialHandle" ADD CONSTRAINT "SocialHandle_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoAccess" ADD CONSTRAINT "SeoAccess_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaidMediaAccess" ADD CONSTRAINT "PaidMediaAccess_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDeliveryLog" ADD CONSTRAINT "ReportDeliveryLog_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMonthlyPlan" ADD CONSTRAINT "ClientMonthlyPlan_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTracker" ADD CONSTRAINT "DailyTracker_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRequest" ADD CONSTRAINT "WorkRequest_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRequest" ADD CONSTRAINT "WorkRequest_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRequest" ADD CONSTRAINT "WorkRequest_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRequest" ADD CONSTRAINT "WorkRequest_sow_id_fkey" FOREIGN KEY ("sow_id") REFERENCES "Sow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
