import {
  Box,
  Button,
  Flex,
  IconButton,
  Spacer,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { ColorModeButton } from '@/components/ui/color-mode';

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  show?: boolean;
  path: string;
}

interface LayoutProps {
  children: ReactNode;
  userName?: string;
  sidebarItems: SidebarItem[];
}

interface SidebarContentProps {
  sidebarItems: SidebarItem[];
  isMobile?: boolean;
  onItemClick?: () => void;
  collapsed?: boolean;
}

const SidebarContent = ({
  sidebarItems,
  onItemClick,
  collapsed = false,
}: SidebarContentProps) => {
  return (
    <Box
      h="full"
      bg="bg.panel"
      borderRight="2px"
      borderColor="border.emphasized"
      shadow="sm"
      display="flex"
      flexDirection="column"
    >
      {/* Navigation */}
      <Stack gap={2} p={4} flex="1">
        {sidebarItems.map((item) => {
          if (item.show === false) return null;
          return (
            <NavLink key={item.id} to={item.path} className="w-full">
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'solid' : 'ghost'}
                  justifyContent={collapsed ? 'center' : 'flex-start'}
                  onClick={onItemClick}
                  w="full"
                  title={collapsed ? item.label : undefined}
                >
                  <Flex align="center" gap={collapsed ? 0 : 3}>
                    {item.icon}
                    {!collapsed && item.label}
                  </Flex>
                </Button>
              )}
            </NavLink>
          );
        })}
      </Stack>
    </Box>
  );
};

const Layout = ({ children, userName, sidebarItems }: LayoutProps) => {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Responsive: use overlay on mobile, sidebar on desktop
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box minH="100vh" bg="bg">
      {/* Top Bar */}
      <Flex
        as="header"
        h="16"
        px={4}
        bg="bg.panel"
        borderBottom="2px"
        borderColor="border.emphasized"
        shadow="sm"
        align="center"
      >
        {/* Desktop sidebar toggle button */}
        {!isMobile && (
          <IconButton
            variant="ghost"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            mr={4}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </IconButton>
        )}

        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            mr={4}
          >
            <Bars3Icon className="w-6 h-6" />
          </IconButton>
        )}

        {/* Logo */}
        <Text fontSize="xl" fontWeight="medium" color="fg.emphasized">
          <NavLink to="/">
            <Text as="span" color="accent.emphasized">
              Algo
            </Text>
            rithmia
          </NavLink>
        </Text>

        <Spacer />

        {/* Top bar controls */}
        <Stack direction="row" gap={4} align="center">
          {/* Language Switcher */}
          <Stack direction="row" gap={2}>
            <Button
              variant={i18n.language === 'en' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => changeLanguage('en')}
            >
              EN
            </Button>
            <Button
              variant={i18n.language === 'zh' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => changeLanguage('zh')}
            >
              中
            </Button>
          </Stack>

          {/* Color Mode Button */}
          <ColorModeButton />

          {/* User Avatar */}
          <Flex align="center" gap={2}>
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bg="accent.emphasized"
              //   color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="sm"
              fontWeight="medium"
            >
              {(userName?.charAt(0) || 'U').toUpperCase()}
            </Box>
            {!isMobile && (
              <Text fontSize="sm" color="fg.muted">
                {userName || 'User'}
              </Text>
            )}
          </Flex>

          {/* Sign out button */}
          <Button variant="ghost" size="sm" colorPalette="red" asChild>
            <NavLink to="/signout">
              <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-2" />
              {!isMobile && 'Sign out'}
            </NavLink>
          </Button>
        </Stack>
      </Flex>

      <Flex h="calc(100vh - 4rem)">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            w={sidebarCollapsed ? '20' : '64'}
            flexShrink={0}
            h="full"
            transition="width 0.3s ease"
          >
            <SidebarContent
              sidebarItems={sidebarItems}
              collapsed={sidebarCollapsed}
            />
          </Box>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            {/* Backdrop */}
            <Box
              position="fixed"
              top="0"
              left="0"
              w="100vw"
              h="100vh"
              bg="blackAlpha.600"
              zIndex="overlay"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar */}
            <Box
              position="fixed"
              top="0"
              left="0"
              w="64"
              h="100vh"
              zIndex="modal"
            >
              <SidebarContent
                sidebarItems={sidebarItems}
                isMobile={true}
                onItemClick={() => setSidebarOpen(false)}
              />
            </Box>
          </>
        )}

        {/* Main Content */}
        <Box flex={1} overflow="hidden">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
