import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface LinkCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  bgColor?: string;
  textColor?: string;
  primary?: boolean;
}

const LinkCard = (props: LinkCardProps) => {
  const {
    title,
    description,
    icon,
    to,
    bgColor = 'bg-slate-800',
    textColor = 'text-indigo-400',
    primary = false,
  } = props;

  return (
    <Link
      to={to}
      className={`${bgColor} p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center border border-slate-700/50 ${primary ? 'hover:scale-105' : 'hover:bg-slate-700'} group`}
    >
      <div
        className={`p-4 ${textColor} bg-slate-800/50 rounded-xl mr-5 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        <p className="text-slate-300 text-sm">{description}</p>
      </div>
    </Link>
  );
};

// Section divider component
const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center my-6">
    <div className="h-px bg-slate-700 flex-grow"></div>
    <h2 className="px-4 text-slate-400 text-sm font-medium uppercase tracking-wider">
      {title}
    </h2>
    <div className="h-px bg-slate-700 flex-grow"></div>
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // Get user roles from localStorage
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      const rolesString = localStorage.getItem('userRoles');
      const roles = rolesString ? JSON.parse(rolesString) : [];
      setUserRoles(roles);
    } else {
      setUserRoles([]);
    }
  }, []);

  const hasRole = (role: string) => userRoles.includes(role);
  const isVerifier = () => hasRole('tester') || isAdmin();
  const isAdmin = () => hasRole('admin') || hasRole('super_admin');
  const isSuperAdmin = () => hasRole('super_admin');
  const isReviewer = () => hasRole('reviewer') || isAdmin();

  const today = new Date();
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-slate-900 min-h-screen p-8 flex flex-col w-full">
      <div className="max-w-6xl mx-auto">
        {/* Header section with welcome message */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-lg mb-10 border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-indigo-400 font-medium mb-2">
                {formattedDate}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('home.welcome', 'Welcome to Algorithmia')}
              </h1>
              <p className="text-slate-300 text-lg">
                {t(
                  'home.quickAccess',
                  'Quick access to your available sections',
                )}
              </p>
            </div>
            <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20 text-white">
              <p className="font-medium text-indigo-300">
                {userRoles.includes('super_admin')
                  ? t('home.roleSuperAdmin', 'Super Admin')
                  : userRoles.includes('admin')
                    ? t('home.roleAdmin', 'Administrator')
                    : userRoles.includes('verifier')
                      ? t('home.roleVerifier', 'Verifier')
                      : userRoles.includes('reviewer')
                        ? t('home.roleReviewer', 'Reviewer')
                        : t('home.roleUser', 'User')}
              </p>
            </div>
          </div>
        </div>

        <SectionDivider title={t('home.coreFeatures', 'Core Features')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <LinkCard
            title={t('home.problemSetting', 'Problem Setting')}
            description={t(
              'home.problemSettingDesc',
              'Create and edit algorithm problems for competitions',
            )}
            icon={<DocumentTextIcon className="w-8 h-8" />}
            to="/problemsetting"
            bgColor="bg-gradient-to-br from-indigo-900/40 to-slate-800"
            primary={true}
          />

          <LinkCard
            title={t('home.chat', 'Discussions')}
            description={t(
              'home.chatDesc',
              'Communicate with other contributors and discuss problems',
            )}
            icon={<ChatBubbleLeftRightIcon className="w-8 h-8" />}
            to="/chat"
            bgColor="bg-gradient-to-br from-blue-900/30 to-slate-800"
            textColor="text-blue-400"
            primary={true}
          />
        </div>

        {(isVerifier() || isAdmin() || isReviewer()) && (
          <>
            <SectionDivider
              title={t('home.moderationTools', 'Moderation Tools')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {isVerifier() && (
                <LinkCard
                  title={t('home.problemVerification', 'Problem Verification')}
                  description={t(
                    'home.problemVerificationDesc',
                    'Verify submitted problems',
                  )}
                  icon={<DocumentCheckIcon className="w-7 h-7" />}
                  to="/problemverification"
                  textColor="text-green-400"
                  bgColor="bg-green-900/10"
                />
              )}

              {isAdmin() && (
                <LinkCard
                  title={t('home.problemBank', 'Problem Bank')}
                  description={t(
                    'home.problemBankDesc',
                    'Manage the problem database',
                  )}
                  icon={<ServerStackIcon className="w-7 h-7" />}
                  to="/problembank"
                  textColor="text-blue-400"
                  bgColor="bg-blue-900/10"
                />
              )}

              {isReviewer() && (
                <LinkCard
                  title={t('home.problemReview', 'Problem Review')}
                  description={t(
                    'home.problemReviewDesc',
                    'Review problems in detail',
                  )}
                  icon={<DocumentMagnifyingGlassIcon className="w-7 h-7" />}
                  to="/problemreview"
                  textColor="text-yellow-400"
                  bgColor="bg-yellow-900/10"
                />
              )}
            </div>
          </>
        )}

        {isSuperAdmin() && (
          <>
            <SectionDivider title={t('home.adminTools', 'Administration')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LinkCard
                title={t('home.superAdmin', 'Admin Dashboard')}
                description={t(
                  'home.superAdminDesc',
                  'System administration and management',
                )}
                icon={<ShieldCheckIcon className="w-7 h-7" />}
                to="/superadmin"
                bgColor="bg-gradient-to-br from-red-900/20 to-slate-800"
                textColor="text-red-400"
              />

              <LinkCard
                title={t('home.competitions', 'Competition Management')}
                description={t(
                  'home.competitionsDesc',
                  'Manage programming competitions and events',
                )}
                icon={<AcademicCapIcon className="w-7 h-7" />}
                to="/superadmin/competitions"
                bgColor="bg-gradient-to-br from-purple-900/20 to-slate-800"
                textColor="text-purple-400"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
