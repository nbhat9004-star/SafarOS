import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(const AsyncValue.loading()) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final localUser = StorageService.getUser();
      if (localUser != null) {
        state = AsyncValue.data(localUser);
        // Verify with server
        try {
          final response = await _apiService.getCurrentUser();
          if (response['ok'] == true && response['user'] != null) {
            final user = User.fromJson(response['user']);
            await StorageService.saveUser(user);
            state = AsyncValue.data(user);
          }
        } catch (e) {
          // Keep local user if server fails
        }
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> login(String email, String password) async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiService.login(email, password);
      if (response['ok'] == true && response['user'] != null) {
        final user = User.fromJson(response['user']);
        await StorageService.saveUser(user);
        state = AsyncValue.data(user);
      } else {
        throw Exception(response['error'] ?? 'Login failed');
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> register(String name, String email, String password) async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiService.register(name, email, password);
      if (response['ok'] == true && response['user'] != null) {
        final user = User.fromJson(response['user']);
        await StorageService.saveUser(user);
        state = AsyncValue.data(user);
      } else {
        throw Exception(response['error'] ?? 'Registration failed');
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.logout();
      await StorageService.clearUser();
      state = const AsyncValue.data(null);
    } catch (e) {
      // Clear local data even if API call fails
      await StorageService.clearUser();
      state = const AsyncValue.data(null);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>(
  (ref) => AuthNotifier(ref.read(apiServiceProvider)),
);

final isLoggedInProvider = Provider<bool>((ref) {
  final auth = ref.watch(authProvider);
  return auth.maybeWhen(
    data: (user) => user != null,
    orElse: () => false,
  );
});
