import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: authState.when(
        data: (user) {
          if (user == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Not logged in'),
                  ElevatedButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Login'),
                  ),
                ],
              ),
            );
          }

          return ListView(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                color: AppTheme.surfaceColor,
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppTheme.primaryColor,
                      child: Text(
                        user.name[0].toUpperCase(),
                        style: const TextStyle(fontSize: 32, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text(user.email, style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.book_online),
                title: const Text('My Bookings'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/booking-history'),
              ),
              ListTile(
                leading: const Icon(Icons.favorite),
                title: const Text('Wishlist'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/wishlist'),
              ),
              ListTile(
                leading: const Icon(Icons.map),
                title: const Text('AI Trip Planner'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/ai-planner'),
              ),
              const Divider(),
              ListTile(
                leading: Icon(Icons.logout, color: AppTheme.errorColor),
                title: Text('Logout', style: TextStyle(color: AppTheme.errorColor)),
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Error loading profile')),
      ),
    );
  }
}
