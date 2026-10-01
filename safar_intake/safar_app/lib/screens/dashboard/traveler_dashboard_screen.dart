import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/booking_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../services/storage_service.dart';
import '../../config/theme.dart';

class TravelerDashboardScreen extends ConsumerWidget {
  const TravelerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsProvider);
    final wishlist = ref.watch(wishlistProvider);
    final aiPlans = StorageService.getAIPlans();

    return Scaffold(
      appBar: AppBar(title: const Text('My Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Bookings Section
          _DashboardSection(
            title: 'My Bookings',
            icon: Icons.book_online,
            color: AppTheme.primaryColor,
            child: bookingsAsync.when(
              data: (bookings) {
                if (bookings.isEmpty) {
                  return const Text('No bookings yet');
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Bookings: ${bookings.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Active: ${bookings.where((b) => b.status == 'confirmed').length}'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => context.go('/booking-history'),
                      child: const Text('View All'),
                    ),
                  ],
                );
              },
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Error loading bookings'),
            ),
          ),
          const SizedBox(height: 16),
          // Wishlist Section
          _DashboardSection(
            title: 'Wishlist',
            icon: Icons.favorite,
            color: Colors.red,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Saved Places: ${wishlist.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => context.go('/wishlist'),
                  child: const Text('View Wishlist'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // AI Plans Section
          _DashboardSection(
            title: 'AI Trip Plans',
            icon: Icons.map,
            color: AppTheme.accentColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Saved Plans: ${aiPlans.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => context.go('/ai-planner'),
                  child: const Text('Create New Plan'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final Widget child;

  const _DashboardSection({
    required this.title,
    required this.icon,
    required this.color,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 12),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}
