import 'package:flutter_test/flutter_test.dart';
import 'package:safar_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SafarApp());
    expect(find.text('Safar'), findsOneWidget);
  });
}
