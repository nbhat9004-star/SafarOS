import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../providers/listings_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../widgets/safar_button.dart';
import '../../config/theme.dart';

class ListingDetailScreen extends ConsumerWidget {
  final String listingId;

  const ListingDetailScreen({super.key, required this.listingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listingAsync = ref.watch(listingDetailProvider(listingId));
    final wishlist = ref.watch(wishlistProvider);
    final formatter = NumberFormat.currency(symbol: '\u20b9', decimalDigits: 0);

    return Scaffold(
      body: listingAsync.when(
        data: (listing) {
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: CachedNetworkImage(
                    imageUrl: listing.images.isNotEmpty ? listing.images[0] : '',
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(color: Colors.grey),
                  ),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      wishlist.contains(listingId) ? Icons.favorite : Icons.favorite_border,
                      color: wishlist.contains(listingId) ? Colors.red : Colors.white,
                    ),
                    onPressed: () => ref.read(wishlistProvider.notifier).toggle(listingId),
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              listing.title,
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                            ),
                          ),
                          if (listing.rating != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.accentColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.star, size: 16, color: Colors.white),
                                  const SizedBox(width: 4),
                                  Text(
                                    listing.rating!.toStringAsFixed(1),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(listing.location, style: TextStyle(color: Colors.grey[600])),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '${formatter.format(listing.price)} / night',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                      ),
                      const Divider(height: 32),
                      const Text('About', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(listing.description),
                      if (listing.amenities != null && listing.amenities!.isNotEmpty) ...[
                        const Divider(height: 32),
                        const Text('Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: listing.amenities!.map((amenity) {
                            return Chip(label: Text(amenity));
                          }).toList(),
                        ),
                      ],
                      const Divider(height: 32),
                      const Text('Host', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primaryColor,
                          child: Text(listing.hostName[0].toUpperCase(), style: const TextStyle(color: Colors.white)),
                        ),
                        title: Text(listing.hostName),
                        subtitle: const Text('Verified Host'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Error loading listing')),
      ),
      bottomNavigationBar: listingAsync.maybeWhen(
        data: (listing) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SafarButton(
              text: 'Book Now',
              onPressed: () => context.go('/booking/$listingId'),
              width: double.infinity,
            ),
          ),
        ),
        orElse: () => const SizedBox.shrink(),
      ),
    );
  }
}
