import 'package:hive_flutter/hive_flutter.dart';
import '../config/constants.dart';
import '../models/user.dart';

class StorageService {
  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(AppConstants.userBoxKey);
    await Hive.openBox(AppConstants.wishlistBoxKey);
    await Hive.openBox(AppConstants.aiPlansBoxKey);
  }

  // User storage
  static Box get _userBox => Hive.box(AppConstants.userBoxKey);

  static Future<void> saveUser(User user) async {
    await _userBox.put('current_user', user.toJson());
  }

  static User? getUser() {
    final data = _userBox.get('current_user');
    if (data == null) return null;
    return User.fromJson(Map<String, dynamic>.from(data));
  }

  static Future<void> clearUser() async {
    await _userBox.delete('current_user');
  }

  // Wishlist storage
  static Box get _wishlistBox => Hive.box(AppConstants.wishlistBoxKey);

  static Future<void> addToWishlist(String listingId) async {
    final wishlist = getWishlist();
    if (!wishlist.contains(listingId)) {
      wishlist.add(listingId);
      await _wishlistBox.put('wishlist', wishlist);
    }
  }

  static Future<void> removeFromWishlist(String listingId) async {
    final wishlist = getWishlist();
    wishlist.remove(listingId);
    await _wishlistBox.put('wishlist', wishlist);
  }

  static List<String> getWishlist() {
    final data = _wishlistBox.get('wishlist', defaultValue: []);
    return List<String>.from(data);
  }

  static bool isInWishlist(String listingId) {
    return getWishlist().contains(listingId);
  }

  // AI Plans storage
  static Box get _aiPlansBox => Hive.box(AppConstants.aiPlansBoxKey);

  static Future<void> saveAIPlan(Map<String, dynamic> plan) async {
    final plans = getAIPlans();
    plan['id'] = DateTime.now().millisecondsSinceEpoch.toString();
    plan['savedAt'] = DateTime.now().toIso8601String();
    plans.add(plan);
    await _aiPlansBox.put('plans', plans);
  }

  static List<Map<String, dynamic>> getAIPlans() {
    final data = _aiPlansBox.get('plans', defaultValue: []);
    return List<Map<String, dynamic>>.from(
      data.map((e) => Map<String, dynamic>.from(e)),
    );
  }

  static Future<void> deleteAIPlan(String planId) async {
    final plans = getAIPlans();
    plans.removeWhere((p) => p['id'] == planId);
    await _aiPlansBox.put('plans', plans);
  }
}
