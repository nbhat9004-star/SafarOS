import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/listings_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../widgets/property_card.dart';
import '../../config/theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listingsAsync = ref.watch(listingsProvider);
    final wishlist = ref.watch(wishlistProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              title: Text('Safar', style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
              actions: [
                IconButton(icon: const Icon(Icons.search), onPressed: () => context.go('/explore')),
              ],
            ),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Discover Kashmir', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text('Explore authentic stays, tours & experiences', style: TextStyle(color: Colors.white70)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/ai-planner'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
                      child: Text('Plan Your Trip', style: TextStyle(color: AppTheme.primaryColor)),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: listingsAsync.when(
                data: (listings) {
                  if (listings.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Center(child: Text('No listings available')),
                    );
                  }
                  return SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.75,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final listing = listings[index];
                        return PropertyCard(
                          listing: listing,
                          onTap: () => context.go('/listing/${listing.id}'),
                          onWishlistTap: () => ref.read(wishlistProvider.notifier).toggle(listing.id),
                          isInWishlist: wishlist.contains(listing.id),
                        );
                      },
                      childCount: listings.length,
                    ),
                  );
                },
                loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
                error: (_, __) => const SliverToBoxAdapter(child: Center(child: Text('Error loading listings'))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
