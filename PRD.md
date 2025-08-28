# Product Requirements Document (PRD)

# Sirb - Peer-to-Peer Learning Platform

**Version:** 1.0  
**Date:** December 2024  
**Project Type:** Collaborative Learning Platform

---

## 📋 **Executive Summary**

Sirb is a peer-to-peer learning platform where senior university students teach junior students through collaborative content creation. Unlike traditional course platforms (Udemy, Coursera), Sirb allows multiple students to contribute content to the same subject and chapter, creating a rich, diverse learning experience while maintaining a cohesive user interface.

---

## 🎯 **Product Vision**

**"Enable university students to learn from each other through collaborative, peer-created content that feels as organized as a professional course."**

### **Core Problem**

- Traditional learning platforms have single instructors per course
- University students often learn better from slightly senior peers
- Quality educational content creation is often siloed
- Students want to contribute knowledge while earning from their expertise

### **Solution**

A platform that aggregates multiple student contributions into cohesive learning experiences, where contributors monetize through YouTube ads while learners get diverse perspectives on complex topics.

---

## 👥 **Target Users**

### **Primary Users**

1. **University Students (Learners)**
   - Age: 18-25
   - Seeking peer explanations of difficult concepts
   - Prefer multiple teaching styles and approaches
   - Want structured learning paths

2. **Senior Students (Contributors)**
   - Age: 20-26
   - Have mastered specific university subjects
   - Want to monetize their knowledge
   - Desire to help junior students

3. **Subject Moderators**
   - Students just finished the subject/taking it now
   - Ensure content quality and organization
   - Manage contributions within their expertise areas

### **Secondary Users**

- **Platform Administrators**: Overall platform management and user oversight

---

## 🚀 **Core Features**

### **Authentication & User Management**

- **Email/password registration and login**
- **OAuth integration (Google, GitHub)**
- **Email verification required**
- **Password reset functionality**
- **Role-based access control**

### **Public Discovery (No Authentication Required)**

- **Subject browsing**: Browse all available subjects
- **Subject detail pages**: View complete course structure
- **Chapters**: See all chapters and content titles
- **Contributor showcase**: View who created content
- **Social sharing**: Share subject/chapter links

### **Learning Experience (Authenticated)**

- **Enrollment system**: One-click enrollment in subjects
- **Chapter content access**: Watch YouTube videos and access materials
- **Progress tracking**: Track completion within chapters and subjects
- **Alternative content discovery**: Access multiple explanations of same concepts
- **Smart content recommendations**: Algorithm-selected best learning path / moderator determined path

### **Content Contribution (Authenticated)**

- **YouTube-based content**: Contributors submit YouTube URLs
- **Metadata submission**: Title, description, difficulty level, teaching approach (Changeable)
- **In-context contribution**: Contribute directly from chapter pages via modal
- **Content status tracking**: Monitor approval status of submissions (emails: approve, reject + on dashboard)

### **Content Moderation**

- **In-place moderation**: Moderators review content within actual chapter context
- **Pending content system**: Content visible to moderators but hidden from learners until approved
- **Approval workflow**: Approve, reject, or request changes (could just work with approve, reject)
- **Quality guidelines**: Ensure content meets platform standards

### **User Dashboard**

- **Learning progress**: Enrolled subjects and completion status
- **Contribution analytics**: Stats for submitted content
- **Quick actions**: Fast access to continue learning or contribute
- **Achievement tracking**: Learning milestones and contribution metrics

---

## 🎨 **User Experience Design**

### **Core UX Principles**

1. **Familiar patterns**: Mimic Udemy/Coursera for easy adoption
2. **Progressive disclosure**: Hide complexity until needed
3. **Context preservation**: Actions happen where they're needed
4. **Minimal friction**: Simple enrollment and contribution flows

### **Key User Flows**

#### **Learner Journey**

```
Landing Page → Browse Subjects → Subject Detail (accordions) →
[Login if needed] → Enroll → Chapter Content → Learn & Progress
```

#### **Contributor Journey**

```
Dashboard → Browse Subjects → Find Chapter →
Contribute Button → Modal Form → Submit → Track Status
```

#### **Moderator Journey**

```
Subject Page → Toggle Moderation View →
Review Pending Content → Approve/Reject → Content Goes Live
```

---

## 🏗️ **Technical Architecture**

### **Technology Stack**

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Better Auth
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Video Hosting**: YouTube (embedded)
- **Deployment**: Vercel

### **Route Structure**

```
/ (public landing)
/subjects (public browse)
/subjects/[subjectId] (public detail)
/subjects/[subjectId]/chapters/[chapterId] (protected content)
/dashboard (protected user home)
/profile (protected user settings)
/admin/dashboard (protected admin panel)
```

### **Authentication Strategy**

- **Public routes**: Subject browsing and discovery
- **Protected routes**: Chapter content, user dashboard, contribution features
- **Role-based features**: Moderation capabilities, admin functions

---

## 📊 **Data Requirements**

### **Core Data Models**

- **Users**: Authentication, roles, university affiliation
- **Subjects**: University courses (Math, Physics, Computer Science)
- **Chapters**: Logical divisions within subjects
- **Content**: YouTube videos, notes, and materials
- **Enrollments**: User-subject relationships
- **Contributions**: User-submitted content with approval status
- **Progress**: User learning advancement tracking

### **Content Management**

- **YouTube Integration**: Store URLs, fetch metadata via API
- **Content Status**: Pending, approved, rejected, needs changes
- **Moderation Queue**: Track review assignments and history
- **Quality Metrics**: User ratings, completion rates, effectiveness scores

---

## 🎯 **Success Metrics**

### **User Engagement**

- **Subject enrollment rate**: % of visitors who enroll
- **Chapter completion rate**: % of enrolled users completing chapters
- **Content consumption**: Average time spent per chapter
- **Return rate**: Daily/weekly active users

### **Content Quality**

- **Approval rate**: % of submitted content approved
- **Content ratings**: User satisfaction with materials
- **Alternative content usage**: How often users try multiple explanations
- **Contributor retention**: % of contributors who submit multiple pieces

### **Platform Health**

- **User growth**: New registrations per month
- **Content growth**: New contributions per month
- **Monetization**: Contributor YouTube revenue (indirect metric)
- **Support metrics**: Response time, resolution rate

---

## 🚦 **Implementation Phases**

### **Phase 1: Core Platform (MVP)**

- ✅ Authentication system
- ✅ Basic page structure
- ✅ Route protection
- 🔄 Database schema implementation
- 🔄 Basic UI components
- 🔄 Subject browsing functionality

### **Phase 2: Content System**

- YouTube integration
- Content submission workflow
- Basic moderation tools
- Enrollment system
- Progress tracking

### **Phase 3: Enhanced Experience**

- Smart content recommendations
- Advanced search and filtering
- User analytics dashboard
- Mobile optimization
- Performance optimization

### **Phase 4: Advanced Features**

- Discussion forums per chapter
- Study group formation
- Advanced analytics
- API for integrations
- Mobile app consideration

---

## 🔒 **Security & Privacy**

### **Data Protection**

- **User authentication**: Secure session management
- **Content validation**: Prevent malicious YouTube links
- **Rate limiting**: Prevent spam submissions
- **Data encryption**: Secure sensitive user information

### **Content Moderation**

- **Quality standards**: Clear guidelines for contributors
- **Abuse prevention**: Report system for inappropriate content
- **Intellectual property**: Respect for copyright and fair use
- **Community guidelines**: Maintain educational focus

---

## 📈 **Future Considerations**

### **Scalability**

- **Database optimization**: Efficient queries for large datasets
- **CDN integration**: Fast content delivery globally
- **Caching strategy**: Reduce server load for popular content
- **Performance monitoring**: Track and optimize bottlenecks

### **Monetization**

- **Contributor revenue**: YouTube ad sharing model
- **Premium features**: Advanced analytics, priority support
- **University partnerships**: Institutional licensing
- **Certification system**: Verified completion certificates

### **Global Expansion**

- **Multi-language support**: Interface localization
- **Regional content**: University-specific subjects
- **Local partnerships**: Collaborate with educational institutions
- **Cultural adaptation**: Respect local learning preferences

---

## 🎉 **Success Definition**

**Sirb will be considered successful when:**

1. **Students consistently choose peer explanations** over traditional resources
2. **Contributors earn meaningful revenue** from their YouTube content
3. **Subject completion rates exceed 70%** (higher than industry average)
4. **Content quality remains high** through effective moderation
5. **Platform becomes the go-to resource** for university students in target subjects

---

**Document Status**: Living document, updated as product evolves  
**Next Review**: After Phase 1 completion  
**Stakeholders**: Development team, potential early users, platform moderators
