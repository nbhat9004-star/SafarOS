import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/listings_provider.dart';
import '../../widgets/property_card.dart';
import '../../widgets/empty_state.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlist = ref.watch(wishlistProvider);
    final listingsAsync = ref.watch(listingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: wishlist.isEmpty
          ? EmptyState(
              icon: Icons.favorite_border,
              title: 'No Saved Places',
              message: 'Start adding your favorite places to your wishlist',
              actionText: 'Explore Listings',
              onAction: () => context.go('/explore'),
            )
          : listingsAsync.when(
              data: (allListings) {
                final wishlistListings = allListings.where((l) => wishlist.contains(l.id)).toList();
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: wishlistListings.length,
                  itemBuilder: (context, index) {
                    final listing = wishlistListings[index];
                    return PropertyCard(
                      listing: listing,
                      onTap: () => context.go('/listing/${listing.id}'),
                      onWishlistTap: () => ref.read(wishlistProvider.notifier).toggle(listing.id),
                      isInWishlist: true,
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(child: Text('Error loading wishlist')),
            ),
    );
  }
}
