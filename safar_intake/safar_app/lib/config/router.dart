import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/explore/explore_screen.dart';
import '../screens/listing/listing_detail_screen.dart';
import '../screens/booking/booking_flow_screen.dart';
import '../screens/booking/booking_history_screen.dart';
import '../screens/wishlist/wishlist_screen.dart';
import '../screens/ai_planner/ai_planner_screen.dart';
import '../screens/dashboard/traveler_dashboard_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/main_navigation_screen.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => MainNavigationScreen(child: child),
      routes: [
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/explore',
          builder: (context, state) => const ExploreScreen(),
        ),
        GoRoute(
          path: '/wishlist',
          builder: (context, state) => const WishlistScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const TravelerDashboardScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/listing/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return ListingDetailScreen(listingId: id);
      },
    ),
    GoRoute(
      path: '/booking/:listingId',
      builder: (context, state) {
        final listingId = state.pathParameters['listingId']!;
        return BookingFlowScreen(listingId: listingId);
      },
    ),
    GoRoute(
      path: '/booking-history',
      builder: (context, state) => const BookingHistoryScreen(),
    ),
    GoRoute(
      path: '/ai-planner',
      builder: (context, state) => const AIPlannerScreen(),
    ),
  ],
);
