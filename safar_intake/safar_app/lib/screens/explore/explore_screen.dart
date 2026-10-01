import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/listings_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../widgets/property_card.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  String? selectedCategory;
  final searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final listingsAsync = selectedCategory == null
        ? ref.watch(listingsProvider)
        : ref.watch(listingsByCategoryProvider(selectedCategory!));
    final wishlist = ref.watch(wishlistProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Explore')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: searchController,
              decoration: InputDecoration(
                hintText: 'Search destinations...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () => searchController.clear(),
                ),
              ),
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: ['stay', 'transport', 'experience', 'tour'].map((cat) {
                final isSelected = selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat.toUpperCase()),
                    selected: isSelected,
                    onSelected: (_) => setState(() => selectedCategory = isSelected ? null : cat),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: listingsAsync.when(
              data: (listings) {
                if (listings.isEmpty) {
                  return const Center(child: Text('No listings found'));
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: listings.length,
                  itemBuilder: (context, index) {
                    final listing = listings[index];
                    return PropertyCard(
                      listing: listing,
                      onTap: () => context.go('/listing/${listing.id}'),
                      onWishlistTap: () => ref.read(wishlistProvider.notifier).toggle(listing.id),
                      isInWishlist: wishlist.contains(listing.id),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(child: Text('Error loading listings')),
            ),
          ),
        ],
      ),
    );
  }
}
