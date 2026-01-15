

import React, { useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native'; 
import { CarouselRef, ControlledCarousel } from '../funcs/customCarousel';








export const Zz_nofilee = () => {
    const carouselRef = useRef<CarouselRef>(null);

    const Page1 = () => (
        <View style={[stylesx.page, { backgroundColor: '#4CAF50' }]}>
            <Text style={stylesx.title}>Welcome Page</Text>
            <Text style={stylesx.description}>This is the first page</Text>

            <TouchableOpacity
                style={stylesx.button}
                onPress={() => carouselRef.current?.goToNext()}
            >
                <Text style={stylesx.buttonText}>Go to Next Page →</Text>
            </TouchableOpacity>
        </View>
    );

    const Page2 = () => (
        <View style={[stylesx.page, { backgroundColor: '#2196F3' }]}>
            <Text style={stylesx.title}>Second Page</Text>
            <Text style={stylesx.description}>You can navigate between pages</Text>

            <View style={stylesx.buttonContainer}>
                <TouchableOpacity
                    style={stylesx.button}
                    onPress={() => carouselRef.current?.goToPrevious()}
                >
                    <Text style={stylesx.buttonText}>← Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={stylesx.button}
                    onPress={() => carouselRef.current?.goToNext()}
                >
                    <Text style={stylesx.buttonText}>Next Page →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const Page3 = () => (
        <View style={[stylesx.page, { backgroundColor: '#FF9800' }]}>
            <Text style={stylesx.title}>Final Page</Text>
            <Text style={stylesx.description}>This is the last page</Text>

            <TouchableOpacity
                style={stylesx.button}
                onPress={() => carouselRef.current?.goToPage(0)} // Go to first page
            >
                <Text style={stylesx.buttonText}>Back to Start</Text>
            </TouchableOpacity>
        </View>
    );

    const pages = [
        <Page1 key="page1" />,
        <Page2 key="page2" />,
        <Page3 key="page3" />,
    ];

    return (
        <View style={{ flex: 1 }}>
            <ControlledCarousel
                ref={carouselRef}
                pages={pages} 
                onPageChange={(index) => console.log('Current page:', index)}
            />
        </View>
    );
}

const stylesx = StyleSheet.create({
    page: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.9,
    },
    button: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
});
